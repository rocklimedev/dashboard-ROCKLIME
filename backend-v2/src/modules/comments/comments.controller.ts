import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  DeleteCommentsByResourceDto,
  FetchCommentsDto,
} from './dto/fetch-comments.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  getComments(@Query() query: FetchCommentsDto) {
    return this.commentsService.getComments(query);
  }

  @Post()
  addComment(@Body() dto: CreateCommentDto, @Req() req: Request) {
    return this.commentsService.addComment(dto, req);
  }

  @Delete('by-resource')
  deleteCommentsByResource(@Body() dto: DeleteCommentsByResourceDto) {
    return this.commentsService.deleteCommentsByResource(
      dto.resourceId,
      dto.resourceType,
    );
  }

  @Delete(':commentId')
  deleteComment(
    @Param('commentId') commentId: string,
    @Body('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.commentsService.deleteComment(commentId, userId, req);
  }
}
